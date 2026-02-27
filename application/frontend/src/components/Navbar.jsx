import { useState } from "react";

function Navbar() {
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <nav style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0 40px', 
            backgroundColor: '#1a1a1a', 
            color: 'white',
            position: 'fixed',    
            top: 0,
            left: 0,
            width: '100%',        
            height: '70px',
            boxSizing: 'border-box', 
            zIndex: 1000,
            borderBottom: '1px solid #333'
        }}>
            <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>PROYECTO FINAL</div>
            
            <div style={{ position: 'relative' }}>
                <button 
                    onClick={() => setOpen((prev) => !prev)}
                    style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        backgroundColor: '#000',
                        border: '2px solid #444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: '0.3s'
                    }}
                >
                    <span style={{ fontSize: '18px' }}></span> 
                </button>

                {open && (
                    <div style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '60px', 
                        backgroundColor: '#2b2b2b', 
                        borderRadius: '12px', 
                        padding: '10px',
                        minWidth: '150px',
                        boxShadow: '0px 10px 25px rgba(0,0,0,0.5)',
                        border: '1px solid #444',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <button 
                            onClick={handleLogout} 
                            style={{ 
                                color: 'white',
                                background: '#3d3d3d', 
                                border: 'none', 
                                borderRadius: '8px',
                                padding: '12px',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                                fontWeight: '500',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;