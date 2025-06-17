'use client';

import { Typography } from "antd";
import Image from "next/image";

const { Text } = Typography;
const About: React.FC = () => {
  
  return (
    <div className="grid items-center justify-items-center">
       <Typography.Title level={1} style={{ margin: 0 }} title="all">About</Typography.Title> 
    </div>
  );
}

export default About;
