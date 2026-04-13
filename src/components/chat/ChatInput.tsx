// useState 组件状态  const [count, setCount] = useState(0); count：当前状态值; setCount：修改状态的方法; 0：初始值
// useRef 用来拿 DOM  或者 存变量（不触发渲染）
// useState会重新执行函数并更新ui useRef不会重新执行函数，不会更新dom
// forwardRef 让父组件能拿到子组件的 ref, 直接控制子组件内部 DOM
// useImperativeHandle 让父组件能拿到子组件的内部方法
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Input, Button } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

// 在vue中相当于 
// props: {
//   disabled: Boolean,
// }
// emits: ['send']
type Props = {
  disabled?: boolean;   // ? = 可选属性, 这个 props 可以传，也可以不传
  onSend: (data: { content: string }) => void; // onSend 是一个函数，这个函数接收一个参数 data, 不返回值, 把data对象传到父组件
}

const ChatInput = forwardRef((props: Props, ref) => {
  const { disabled, onSend } = props;
  
  const [inputValue, setInputValue] = useState(""); // 马上更新dom的
  const textareaRef = useRef<any>(null); // 不用马上更新dom的

  // 暴露给父组件: 情况输入框的方法
  useImperativeHandle(ref, () => ({
    clearInput: () => {
      setInputValue("");
    }
  }))

   // 发送逻辑
  const handleSend = () => {
    if (disabled) return;

    const content = inputValue.trim();
    if (!content) return;

    setInputValue("");

    onSend?.({
      content
    })
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input" style={{ position: "relative" }}>
      <Input.TextArea 
        ref={textareaRef}
        value={inputValue}
        disabled={disabled}
        placeholder="在此输入问题，按 Shift+Enter 换行"
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoSize={{ minRows: 4, maxRows: 6 }}
      />
      <Button 
        type="primary"
        shape="circle"
        icon={<ArrowUpOutlined />}
        disabled={disabled || !inputValue.trim()}
        onClick={handleSend}
        style={{
          position: "absolute",
          right: 12,
          bottom: 10,
        }}
      />
    </div>
  )

})
export default ChatInput;