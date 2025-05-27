// pages/_app.js
import '../app/globals.css';
import Layout from '@/components/Layout'; // 곧 만들 Layout 컴포넌트

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}