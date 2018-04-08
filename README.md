需要事先配置在connPools.js 配置mysql
建表可以参考以下代码
```
create table referee(
refereeid bigint not null primary key auto_increment,
title varchar(150) not null,
content varchar(10000) not null,
type varchar(60),
source varchar(100),
casenum varchar(100),
updtime timestamp not null,
createtime timestamp not null
)ENGINE=innodb DEFAULT CHARSET=utf8;
```

然后就可以使用
`
node referee
`
爬取数据了