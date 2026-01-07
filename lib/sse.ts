/**
 * SSE (Server-Sent Events) utility for streaming responses
 */

export interface SSEResponse {
  stream: ReadableStream;
  sendEvent: (event: string, data: any) => void;
  close: () => void;
}

/**
 * Creates an SSE response handler for streaming data to the client
 */
export function createSSEResponse(): SSEResponse {
  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
    },
    cancel() {
      controllerRef = null;
    },
  });

  const sendEvent = (event: string, data: any) => {
    if (controllerRef) {
      try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controllerRef.enqueue(encoder.encode(message));
      } catch (error) {
        console.error("Error sending SSE event:", error);
      }
    }
  };

  const close = () => {
    if (controllerRef) {
      try {
        controllerRef.close();
      } catch (error) {
        console.error("Error closing SSE stream:", error);
      } finally {
        controllerRef = null;
      }
    }
  };

  return { stream, sendEvent, close };
}

/**
 * Client-side SSE event handler types
 */
export type SSEEventHandler = (data: any) => void;

export interface SSEEventHandlers {
  onProgress?: SSEEventHandler;
  onAssistantResponse?: SSEEventHandler;
  onComplete?: SSEEventHandler;
  onError?: SSEEventHandler;
}

/**
 * Client-side helper to consume SSE streams
 */
export async function consumeSSEStream(
  response: Response,
  handlers: SSEEventHandlers
): Promise<void> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("No response body");
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("event:")) {
          const eventType = line.replace("event:", "").trim();
          const dataLine = lines[i + 1];

          if (dataLine?.startsWith("data:")) {
            try {
              const data = JSON.parse(dataLine.replace("data:", "").trim());

              switch (eventType) {
                case "progress":
                  handlers.onProgress?.(data);
                  break;
                case "assistant_response":
                  handlers.onAssistantResponse?.(data);
                  break;
                case "complete":
                  handlers.onComplete?.(data);
                  break;
                case "error":
                  handlers.onError?.(data);
                  break;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// // Helper to create SSE response
// export function createSSEResponse() {
//   const encoder = new TextEncoder();
//   let controller: ReadableStreamDefaultController;

//   const stream = new ReadableStream({
//     start(ctrl) {
//       controller = ctrl;
//     },
//   });

//   const sendEvent = (event: string, data: unknown) => {
//     const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
//     controller.enqueue(encoder.encode(message));
//   };

//   const close = () => {
//     controller.close();
//   };

//   return { stream, sendEvent, close };
// }
