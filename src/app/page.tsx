import { Space, Button, Typography } from 'antd';


const { Paragraph } = Typography;
const Home = () => {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Space direction="vertical">
        <Button type="primary">
          Parallel Corpus
        </Button>
      </Space>
    </div>
  );
}
export default Home;
