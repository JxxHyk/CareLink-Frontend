// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko"> {/* HTML lang 속성 한국어로 변경 */}
      <Head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css"
          rel="stylesheet"
        />
        {/* Pacifico, Inter 폰트는 globals.css에서 @import로 로드 */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}