import { useChat } from '@ai-sdk/react'

function Test() {
  const chat = useChat()
  console.log(Object.keys(chat))
  return null
}
