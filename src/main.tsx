import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import 'antd/dist/reset.css';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#201d18',
        colorPrimaryHover: '#342f27',
        colorPrimaryActive: '#15120f',
        colorLink: '#244a8f',
        colorText: '#201d18',
        colorTextSecondary: '#726b5e',
        colorBorder: '#e0dace',
        colorBgBase: '#fbfaf6',
        colorBgContainer: '#fbfaf6',
        colorBgLayout: '#f3f0e9',
        borderRadius: 10,
        controlHeight: 40,
        fontFamily: "Geist, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      components: {
        Button: { primaryShadow: 'none' },
        Card: { headerBg: '#fbfaf6' },
        Table: { headerBg: '#f7f4ee', headerColor: '#726b5e' },
      },
    }}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
