import { useChat } from '@ai-sdk/react'

function Test() {
  const { append, sendMessage } = useChat() as any
  console.log('test')
  return null
}
