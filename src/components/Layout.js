const Layout = ({ sidebar, children }) => (
  <div className="container">
    <div className="main">{children}</div>
    <div className="sidebar">{sidebar}</div>
    <style jsx>{`
      .container {
        width: 100%;
        height: 100vh;
      }
      .sidebar {
        position: fixed;
        width: 500px;
        height: 100%;
        top: 0;
        left: 0;
        border-right: 1px solid #ccc;
        background: white;
        overflow: auto;
      }
      .main {
        display: flex;
        position: relative;
        justify-content: center;
        align-items: center;
        width: 55%;
        height: 85%;
        background: #eee;
        left: 595px;
        top: 55px;
        // margin-top: 4%;
      }
      @media screen and (max-width: 1000px) {
        .sidebar {
          position: relative;
          width: 100%;
          height: auto;
          border-right: 0;
        }
        .main {
          position: relative;
          width: 100%;
        }
      }
    `}</style>
  </div>
)

export default Layout
