// components/Layout.js
import Navbar from './Navbar';
import SubHeader from './SubHeader';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <SubHeader /> {/* SubHeader는 페이지별로 내용이 달라질 수 있으므로, 필요에 따라 index.js 등으로 옮겨도 됨 */}
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default Layout;