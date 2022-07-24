import React from "react";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { NavBar, ChatCard, Message, AddNewChat } from './components/Components.js';
import { ethers } from "ethers";
import { abi } from "./abi";


const CONTRACT_ADDRESS = "0xFd2e8c9514137526ebB38ba537C723A581FDBE7e"; 

export function App( props ) {  
    const [friends, setFriends] = useState(null);
    const [myName, setMyName] = useState(null);
    const [myPublicKey, setMyPublicKey] = useState(null);
    const [activeChat, setActiveChat] = useState({ friendname: null, publicKey: null });
    const [activeChatMessages, setActiveChatMessages] = useState(null);
    const [showConnectButton, setShowConnectButton] = useState("block");
    const [myContract, setMyContract] = useState(null);
  
    
    const contractABI = abi; 
    let provider;
    let signer;

    
    async function login() {
        let res = await connectToMetamask();
        if( res === true ) {
            provider = new ethers.providers.Web3Provider( window.ethereum );
            signer = provider.getSigner();
            try {
				const contract = new ethers.Contract( CONTRACT_ADDRESS, contractABI, signer );
				setMyContract( contract );
				const address = await signer.getAddress();         
				let present = await contract.checkUserExists( address );
				let username;
				if( present )
					username = await contract.getUsername( address );
				else {
					username = prompt('Enter a username', 'Guest'); 
					if( username === '' ) username = 'Guest';
					await contract.createAccount( username );
				}
				setMyName( username );
				setMyPublicKey( address );
				setShowConnectButton( "none" );
			} catch(err) {
				alert("CONTRACT_ADDRESS not set properly!");
			}
        } else {
            alert("Couldn't connect to Metamask");
        }    
    }

    
    async function connectToMetamask() {
        try {
            await window.ethereum.enable();
            return true;
        } catch(err) {
            return false;
        }
    }

    
    async function addChat( name, publicKey ) {
        try {
			let present = await myContract.checkUserExists( publicKey );
			if( !present ) {
				alert("Given address not found: Ask him to join the app :)");
				return;
			}
			try {
				await myContract.addFriend( publicKey, name );
				const frnd = { "name": name, "publicKey": publicKey };
				setFriends( friends.concat(frnd) );
			} catch(err) {
				alert("Friend already Added! You can't be friend with the same person twice ;P");
			}
		} catch(err) {
			alert("Invalid address!")
		}
    }

    
    async function sendMessage( data ) {
        if( !( activeChat && activeChat.publicKey ) ) return;
        const recieverAddress = activeChat.publicKey;
        await myContract.sendMessage( recieverAddress, data );
    } 

    
    async function getMessage( friendsPublicKey ) {
        let nickname;
        let messages = [];
        friends.forEach( ( item ) => {
            if( item.publicKey === friendsPublicKey )
                nickname = item.name;
        });
        
        const data = await myContract.readMessage( friendsPublicKey );
        data.forEach( ( item ) => {
            const timestamp = new Date( 1000*item[1].toNumber() ).toUTCString();
            messages.push({ "publicKey": item[0], "timeStamp": timestamp, "data": item[2] });
        });
        setActiveChat({ friendname: nickname, publicKey: friendsPublicKey });
        setActiveChatMessages( messages );
    }

    
    useEffect( () => {
        async function loadFriends() {
            let friendList = [];
            
            try {
                const data = await myContract.getMyFriendList();
                data.forEach( ( item ) => {
                    friendList.push({ "publicKey": item[0], "name": item[1] });
                })
            } catch(err) {
                friendList = null;  
            }
            setFriends( friendList );
        }
        loadFriends();
    }, [myPublicKey, myContract]);

    
    const Messages = activeChatMessages ? activeChatMessages.map( ( message ) => {
        let margin = "5%";
        let sender = activeChat.friendname;
        if( message.publicKey === myPublicKey ) {
            margin = "15%";
            sender = "You";
        }
        return (
            <Message marginLeft={ margin } sender={ sender } data={ message.data } timeStamp={ message.timeStamp } />
        );
    }) : null;
  
    
    const chats = friends ? friends.map( ( friend ) => {
     return (
         <ChatCard publicKey={ friend.publicKey } name={ friend.name } getMessages={ ( key ) => getMessage( key ) } />
     );
    }) : null;

    return (
        <Container style={{ padding:"30px", border:"5px solid gold",borderRadius:"30px" }}>
            {}
            <NavBar username={ myName } login={ async () => login() } showButton={ showConnectButton } />
            <Row>
                {}
                <Col style={{ "paddingRight":"1px", "borderRight":"2px solid #202020" }}>
                    <div style={{ backgroundImage:"url('https://img.freepik.com/free-vector/blue-background-with-halftone-diagonal-lines_1017-30146.jpg?w=360')", 
                    backgroundSize:"cover",height:"100%", overflowY:"auto" }}>
                          <Row style={{ marginRight:"0px" }}  >
                              <Card style={{ width:'100%', alignSelf:'center', marginLeft:"17px",marginRight:"2px" }}>
                                <Card.Header>
                                    Chats
                                </Card.Header>
                              </Card>
                          </Row>
                          { chats }
                          <AddNewChat myContract={ myContract } addHandler={ ( name, publicKey ) => addChat( name, publicKey )} />
                    </div>
                </Col>
                <Col xs={ 8 } style={{ "paddingLeft":"0px" }}>
                    
                    <div style={ {backgroundImage:"url('https://cdn.pixabay.com/photo/2016/06/02/02/33/triangles-1430105__480.png')"
                        , height:"527px",overflowY:"auto",backgroundSize:"cover",backgroundRepeat:"no-repeat",
                                     marginTop:"0px" } }>
                        {}
                        <Row style={{ marginRight:"0px" }}>
                              <Card style={{ width:'100%', alignSelf:'center', margin:"0 0 5px 15px" }}>
                                <Card.Header>
                                    { activeChat.friendname } : { activeChat.publicKey }
                                    <Button style={{ float:"right" }} variant="warning" onClick={ () => {
                                        if( activeChat && activeChat.publicKey )
                                            getMessage( activeChat.publicKey );
                                    } }>
                                        Refresh
                                    </Button>
                                </Card.Header>
                            </Card>
                        </Row>
                        {}
                        <div className="MessageBox" style={{height:"400px" }}>
                           { Messages }
                        </div>
                        {}
                        <div className="SendMessage"  style={{ borderTop:"2px solid black", position:"relative", bottom:"0px", padding:"10px 45px 0 45px", margin:"0 95px 0 0", width:"97%" }}>
                            <Form onSubmit={ (e) => {
			                	e.preventDefault();
			                	sendMessage( document.getElementById( 'messageData' ).value );
			                	document.getElementById( 'messageData' ).value = "";
			                }}>
                                <Form.Row className="align-items-center">
                                    <Col xs={9}>
                                        <Form.Control id="messageData" className="mb-2"  placeholder="Send Message" />
                                    </Col>
                                    <Col >
                                      <Button className="mb-2" style={{ float:"right" }} onClick={ () => {
                                          sendMessage( document.getElementById( 'messageData' ).value );
                                          document.getElementById( 'messageData' ).value = "";
                                      }}>
                                        Send
                                      </Button>
                                    </Col>
                                </Form.Row>
                            </Form>
                        </div> 
                    </div>
                    
                </Col>
            </Row>
        </Container>
    );
}
