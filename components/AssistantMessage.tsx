// // components/AssistantMessage.tsx

// import { Message } from "@/types/chat";
// import { isAssistantContent } from "@/lib/isStructuredContent";

// type Props = {
//   content: Message["content_text"];
//   onSuggestionClick: (q: string) => void;
// };

// export function AssistantMessage({ content, onSuggestionClick }: Props) {
//   if (typeof content === "string") {
//     return <p>{content}</p>;
//   }

//   if (!isAssistantContent(content)) {
//     return <p>Invalid response</p>;
//   }

//   return (
//     <div className="space-y-2">
//       <p>{content.answer}</p>

//       {content.suggestions && content.suggestions.length > 0 && (
//         <div className="mt-3">
//           <p className="text-xs text-gray-500 mb-1">
//             Suggested questions
//           </p>

//           <ul className="space-y-1">
//             {content.suggestions.map((q, i) => (
//               <li key={i}>
//                 <button
//                   type="button"
//                   onClick={() => onSuggestionClick(q)}
//                   className="text-blue-600 text-xs hover:underline text-left"
//                 >
//                   {q}
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
