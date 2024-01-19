import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor (
    private データベース:DatabaseService,
    ){}
  getHello(): string {
    return 'Hello World!';
  }

  async アバターパス取得(ユーザID:number){
    const ユーザ情報 = await this.データベース.getUserFromId(ユーザID);
    if (!ユーザ情報)
      throw new InternalServerErrorException();
    return ユーザ情報.avatar;
  }

}
