import { Body, Controller, FileTypeValidator, Get, HttpCode, InternalServerErrorException, MessageEvent, NotFoundException, Param, ParseFilePipe, ParseIntPipe, Post, Put, Query, Req, Sse, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthedReq } from './auth/dto/auth.dto';
import { Observable, Subject } from 'rxjs';
import { OnlineService } from './online/online.service';
import { AuthByQuery, NoAuthentication } from './auth/auth.guard';
import { DatabaseService } from './database/database.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { writeFile } from 'fs';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private onlineService:OnlineService,
		private databaseService:DatabaseService,
		private 設定情報:ConfigService
		) {}

	@Get('me')
	async me(@Req() {user}:AuthedReq) {
		const data = await this.databaseService.getUserFromId(user.sub)
		if (!data)
			throw new NotFoundException();
		const {createdAt, updatedAt, intraId, hashedPassword, status, ...user_info} = data;
		return user_info;
	}

	@Sse('event')
	@AuthByQuery()
	event(@Req() {socket, user}: AuthedReq): Observable<MessageEvent> {
		const subject = new Subject<MessageEvent>();
		const del_func = this.onlineService.establishConnection(user.sub, 'HOME', subject);
		socket.on('close', del_func);
		return subject;
	}

	@Put('avatar')
    @UseInterceptors(FileInterceptor('avatar',{}))
    async アバターエンドポイント(
        @Req() {user}:AuthedReq, 
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                  new FileTypeValidator({ fileType: 'image/jpeg' }),
                ],
              }),        
        ) アバターファイル: Express.Multer.File
    ) {
        const 新規アバタファイル名 = `avatar${user.sub}_${Date.now()}.jpg`;
        const 新規アバターURI = `http://${this.設定情報.get<string>('DOMAIN_NAME') || 'localhost'}/image/${新規アバタファイル名}`
        writeFile(`/home/data/image/${新規アバタファイル名}`,アバターファイル.buffer,(e)=>{if (e){throw new InternalServerErrorException();}});
        await this.databaseService.users.update({
            where:{
                id:user.sub
            },
            data:{
                avatar:新規アバターURI
            }
        });
        return {avatar:新規アバターURI}
    }

	@Put('nickname')
    async ニックネームエンドポイント(
        @Req() {user}:AuthedReq, 
        @Body('nickname') ニックネーム: string
    ) {
        await this.databaseService.users.update({
            where:{
                id:user.sub
            },
            data:{
                nickname:ニックネーム
            }
        });
        return {nickname:ニックネーム}
    }

	@Put('password')
	@HttpCode(204)
    async パスワードエンドポイント(
        @Req() {user}:AuthedReq, 
        @Body('password') パスワード:string
    ) {
		const ハッシュ化されたパスワード = await bcrypt.hash(パスワード, 12);
        await this.databaseService.users.update({
            where:{
                id:user.sub
            },
            data:{
                hashedPassword:ハッシュ化されたパスワード
            }
        });
        return ;
    }

    @Get('twoFactor')
	async getTwoFact(@Req() {user}:AuthedReq){
        const user_data = await this.databaseService.users.findUnique({
            where:{
                id:user.sub
            }
        });
		return {isAuthentication:user_data?.isAuthentication ? "ON":"OFF"}
	}

    @Post('twoFactor')
	async setTwoFact(@Req() {user}:AuthedReq){
        const user_data = await this.databaseService.users.findUnique({
            where:{
                id:user.sub
            }
        });
        await this.databaseService.users.update({
            where:{
                id:user.sub
            },
            data:{
                isAuthentication:!(user_data?.isAuthentication)
            }
        });
		return {isAuthentication:user_data?.isAuthentication ? "OFF":"ON"}
	}

	@Get('onlineUser')
	@NoAuthentication()
	onlineUser(){
		return this.onlineService.getConnections();
	}

	@Get('onlineUser/:id')
	@NoAuthentication()
	onlineUser_id(@Param('id',ParseIntPipe)user_id: number){
		return this.onlineService.getStatus(user_id);
	}
}
