/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 临时类型声明，避免 TS 无法解析 @cloudbase/js-sdk 类型
declare module '@cloudbase/js-sdk'


