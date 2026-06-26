const fs = require('fs')
let code = fs.readFileSync('features/assistant/index.tsx', 'utf8')
if (code.includes('maxSteps')) {
  console.log("maxSteps already exists in useChat")
} else {
  code = code.replace("const { messages, input: localInput, setInput: setLocalInput, handleInputChange, isLoading, error, setMessages } = useChat({", "const { messages, input: localInput, setInput: setLocalInput, handleInputChange, isLoading, error, setMessages } = useChat({\n    maxSteps: 5,")
  fs.writeFileSync('features/assistant/index.tsx', code)
  console.log("Added maxSteps to useChat")
}
