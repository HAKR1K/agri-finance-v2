import BottomNav from './BottomNav';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

export default Layout;
