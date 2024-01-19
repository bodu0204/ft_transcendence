export type StatusEvent = {
	data_type:'STATUS';
	content:{
		id:number;
		status:string[];
	};
};