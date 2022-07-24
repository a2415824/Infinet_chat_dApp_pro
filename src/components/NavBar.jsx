import React from "react";
import { Button, Navbar } from "react-bootstrap";


export function NavBar( props ){
    return (
        <Navbar bg="primary" variant="dark" >
            <Navbar.Brand href="#home" >
                 <h3 style={{fontsize:"50px",color:"white"}}>
                -------------------------=====Infinet Chat DApp=====------------------- 
                </h3>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
                <Navbar.Text> 
                    <Button style={{ display: props.showButton }} variant="success" onClick={ async () => { props.login(); }}>
                        Connect to Metamask
                    </Button>
                    <div style={{ display: props.showButton === "none" ? "block" : "none" }}>
                        Signed in as: 
                        <a href="#"> 
                            { props.username }
                        </a>
                    </div>
                </Navbar.Text>
            </Navbar.Collapse>
        </Navbar>
    );
}