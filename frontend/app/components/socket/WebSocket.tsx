import { Socket, io } from "socket.io-client";

export class WebSocket {
	public _socket: Socket | null;
	constructor(uri?:URL) {
		this._socket = null;
		if (uri && !this._socket){
			this._socket = io(`http://${uri.host}`);
		}
	}
	get socket(){
		if (!this._socket){
			console.log("NO_SOCKET_CONNECTION");
		}
		return this._socket;
	}

	del() {
		if (this._socket){
			this._socket.close();
		}
		this._socket = null;
	}

	get delfunc(){
		return (this.del).bind(this);
	}

}