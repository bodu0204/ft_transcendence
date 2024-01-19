import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';
import { StatusEvent } from './interface/online.interface';

@Injectable()
export class OnlineService {
	private online_user: Map<number/*ユーザID*/, Map<string/* タイプ */, Set<Subject<MessageEvent>>>>

	constructor() {
		this.online_user = new Map();
	}

	private sendStatus(id :number){
		const event: StatusEvent = {
			data_type:'STATUS',
			content: {
				id: id,
				status: this.getStatus(id),
			}
		}
		const message_event: MessageEvent = {
			data: event,
		};
		this.online_user.forEach((v,_)=>{
			v.forEach((val, key)=>{
				if(key === 'FRIEND' || key.startsWith('CHANNEL/')){
					val.forEach((subject)=>subject.next(message_event))
				}
			});
		});
	}

	removeUser(id:number, type:string){
		const user_set = this.online_user.get(id);
		if (!user_set)
			return ;
		user_set.delete(type)
		if (!user_set.size)
			this.online_user.delete(id);
		this.sendStatus(id);
		return ;
	}

	removeType(type:string){
		const status_changed :number[]=[] 
		this.online_user.forEach((v,k)=>{
			if (v.has(type)){
				v.delete(type)
				status_changed.push(k)
			}
		});
		status_changed.forEach(((v:number)=>{this.sendStatus(v)}).bind(this))
		return ;
	}

	establishConnection(id:number, type:string, subject:Subject<MessageEvent>) {
		if (this.online_user.has(id)) {
			if (this.online_user.get(id)?.has(type)) {
				this.online_user.get(id)?.get(type)?.add(subject);
			} else {
				const subject_set = new Set([subject]);
				this.online_user.get(id)?.set(type, subject_set);
				this.sendStatus(id);
			}
		} else {
			const subject_set = new Set([subject]);
			const user_set = new Map([[type, subject_set]]);
			this.online_user.set(id, user_set);
			this.sendStatus(id);
		}
		const delUser = () => {
			const user_set = this.online_user.get(id);
			if (!user_set)
				return ;
			const subject_set = user_set.get(type);
			if(!subject_set)
				return ;
			subject_set.delete(subject);
			if (subject_set.size)
				return ;
			user_set.delete(type);
			if (!user_set.size){
				this.online_user.delete(id);
			}
			this.sendStatus(id);
			return ;
		}
		return delUser.bind(this);
	}

	sendData(id: number, data: object, type: string) {
		const user = this.online_user.get(id);
		if (!user)
			return;
		const subjects = user.get(type);
		if (!subjects)
			return;
		const message_event: MessageEvent = {
			data: data,
		};
		subjects.forEach((v) => {v.next(message_event);});
	}

	sendShareData(data: object, type: string) {
		const message_event: MessageEvent = {
			data: data,
		};
		this.online_user.forEach((v, k) => {
			if (v.has(type)){
				v.get(type)?.forEach((vv) => {
					vv.next(message_event);
				});
			}
		});
	}

	getConnections() {
		const conections: {id: number, conection: any[]}[] = [];
		this.online_user.forEach((v1, k1) => {
			const connection_types: {type: string, count: number}[] = [];
			v1.forEach((v2, k2) => {
				connection_types.push({type: k2, count:v2.size});
			});
			conections.push({id: k1, conection: connection_types});
		});
		return conections;
	}

	getStatus(id: number) {
		const user_set = this.online_user.get(id);
		if (!user_set){
			return [];
		}
		const connection_types: string[] = [];
		user_set.forEach((_,key)=>{connection_types.push(key)});
		return connection_types;
	}
}
