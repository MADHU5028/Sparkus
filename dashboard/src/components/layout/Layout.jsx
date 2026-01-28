import Navbar from './Navbar.jsx';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">
                <div className="content-container">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
