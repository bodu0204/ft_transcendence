import { IsString, IsNumber, IsEmail, IsUrl, IsNotEmpty, MinLength, MaxLength } from "class-validator";
import { Request } from "express";

export class AuthDto {
	@IsEmail()
	email: string;

	@IsString()
	name: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	@MaxLength(20)
	password: string;
}

export class IdPassDto {
	@IsEmail()
	email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	@MaxLength(20)
	password: string;
}



//export class UserDetail {
//	@IsNumber()
//	intraId: number | null = null;

//	@IsString()
//	name: string;

//	@IsEmail()
//	email: string | null = null;

//	@IsString()
//	hashedPassword: string | null = null

//	@IsUrl()
//	avatar: string = "";
//};

export class UserDetail {
	@IsNumber()
	intraId: number;

	@IsEmail()
	email: string;

	@IsString()
	name: string;

	@IsUrl()
	avatar: string;
};

//const res = new Response42();

export type AuthedReq = {user:{sub:number}} & Request;