import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import { useEffect, useState } from "react";
import { getModelsRequest } from "../../api/chat.ts"; 

type Props = {
  value: string;
  onModelChange: (value: string) => void;
}

type ModelItem = {
  key: string;
  label: string;
}

const ChatHeader = ({ value, onModelChange }: Props) => {
  const [modelList, setModelList] = useState<ModelItem[]>([]);

  useEffect(() => { // 组件渲染后的钩子 == onMounted()
    const getModels = async () => {
      try {
        const res = await getModelsRequest();
        setModelList(res.data.map((item: any) => ({ key: item.id, label: item.id })));
      } catch (error) {
        console.error("获取模型失败:", error);
      }
    }
    getModels();
  }, []); // 只执行一次;   useEffect(() => {}, [value]) -> value变了就执行
  

  return (
    <div style={styles.chatHeaderContainer}>
      <div style={styles.leftContainer}>
        <Dropdown menu={{ items: modelList, onClick: ({key}) => { onModelChange(key) } }} trigger={["click"]}>
          <div style={{ cursor: "pointer" }}>
            <Space>
              <span>{value}</span>
              <DownOutlined />
            </Space>
          </div>
        </Dropdown>
      </div>
      <div style={styles.rightContainer}></div>
    </div>
  )
}
export default ChatHeader;

const styles: Record<string, any> = {
  chatHeaderContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
  },
  leftContainer: {
    width: "200px",
    height: "100%",
  },
  rightContainer: {
    width: "200px",
    height: "100%",
  }
}
