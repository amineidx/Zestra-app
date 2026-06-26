const { useChat } = require('@ai-sdk/react');
const React = require('react');

// We can't really mock the hook fully, but let's just grep the dist files for the return type of useChat
const fs = require('fs')
const dts = fs.readFileSync('node_modules/@ai-sdk/react/dist/index.d.ts', 'utf8')
const useChatDef = dts.match(/export declare function useChat[\s\S]*?\):([\s\S]*?);/)[1]
console.log(useChatDef)
