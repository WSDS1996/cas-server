import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import Common from './common';

@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  // 应用名称
  @Column('varchar', { unique: true })
  name: string;

  // 描述
  @Column('varchar', { nullable: true })
  desc: string;

  // 域名
  @Column('varchar', { unique: true })
  domain: string;

  // ip白名单
  @Column('varchar', { unique: true })
  whitelistIp: string;

  // 状态0关闭，1开启
  @Column('boolean', { unique: true })
  isEnable: boolean;

  // 管理员（注册应用的人）
  @Column('varchar', { unique: true })
  administrator: string;

  // 用户成员（可登录系统的人）
  @Column('varchar', { unique: true })
  members: string;

  // 应用token
  @Column('varchar', { unique: true })
  token: string;

  // 是否开启调试
  @Column('boolean', { unique: true })
  isDebug: boolean;

  // 有效期限
  @Column('datetime', { nullable: true })
  expire: Date;

  @Column(() => Common)
  common: Common;
}

export default Application;
