# 🐱 에어팟냥 봇

디스코드 서버에서 **음성 채널에 일정 기간 동안 참여하지 않은 유저**를 감지하고,
**관리자에게 DM으로 알림을 보내는 자동화된 디스코드 봇**입니다.

> 서버 운영자가 장기 미참여자를 파악하거나, 비활성 멤버를 관리하는 데 도움을 줍니다.
> 아직은 다국어를 지원하지 않습니다. 한국어로 지원되는 봇입니다.


## Discord 설정
- DM이 안오신다면, Discord > 설정 > 콘텐츠 및 소셜 > 소셜 권한 > 해당 서버의 "다이렉트 메시지" 옵션을 "True"로 설정하셔야 DM을 받으실 수 있어요.
- DM으로는 매일 오후 5시 30분에 비활성 유저 목록을 받으실 수 있습니다. (있을 시에만 옵니다)


## 서버에 적용해 보기
[에어팟냥 초대하기](https://discord.com/oauth2/authorize?client_id=1381815491164897321&permissions=8&integration_type=0&scope=bot+applications.commands)


## 가이드
1. 먼저 얼마동안 음성 채팅을 하지 않은 사람을 확인할지 설정
```bash
/참여기준 10 일
```
> 이 봇을 초대한 이후로... 해당 시간 이내 음성 채널에서 활동이 없는 구성원을 찾아줍니다. 과거 이력은 참고하지 않습니다.
> 숫자는 정수만, 일 또는 시간 단위로 명령어 지원합니다.

2. 어떤 관리자에게 알림을 보낼지 설정 (여러명 가능!)
```bash
/관리자 @rekenzo
```
3. 음성 채팅 기록을 확인하지 않을 사람 설정 (여러명 가능!)
```bash
/제외 @rekenzo
```
4. 설정이 잘 되었는지 확인
```bash
/상태확인
```
5. 5시 반에 알림이 오지만, 미리 수동으로 알림 미리 받아보기
```bash
/비활성확인
```

---

## 전체 기능

| 명령어      | 설명                                                |
| -------- | ------------------------------------------------- |
| `/참여기준`  | 비활성으로 간주할 기준(일/시간)을 설정합니다.                        |
| `/관리자`   | 비활성 유저 알림을 받을 관리자를 등록합니다.                         |
| `/관리자목록` | 현재 등록된 관리자 목록을 확인합니다.                             |
| `/제외`    | 특정 유저를 비활성 감지 대상에서 제외합니다.                         |
| `/제외목록`  | 제외된 유저 목록을 확인합니다.                                 |
| `/제외삭제`  | 제외 목록에서 유저를 제거하여 다시 감지 대상으로 만듭니다.                 |
| `/초기화`   | 서버 설정과 참여 기록을 초기화하고, 모든 멤버의 참여 시각을 현재 시각으로 등록합니다. ⚠️ 사용에 주의 필요.|
| `/상태확인`  | 설정된 비활성 기준, 관리자, 제외 대상 등을 확인합니다.                  |
| `/비활성확인` | 지금 즉시 비활성 유저를 검사하고 관리자에게 DM으로 알립니다. (수동 검사)       |
| `/상세로그`  | 모든 유저의 마지막 음성 채널 참여 시각을 확인합니다. (ephemeral 응답)     |

## Bot 권한
- Admin

---

# Developer Only

## ⚙ 서버 설치 및 실행 방법

### 1. 디펜던시 설치

```bash
npm install
```

### 2. .env 파일 생성

```env
BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
```
- CLIENT_ID는 Discord Developer Portal의 Application ID입니다.

### 3. 슬래시 명령어 등록
```bash
node deploy-commands.js
```

### 4. 봇 실행
```bash
node index.js
```

## 프로젝트 구조
```bash
airpotsCat/
├── index.js                 # 메인 파일 (봇 실행 및 이벤트 등록)
├── commands.js              # 슬래시 명령어 핸들러 및 명령 로직
├── scheduler.js             # 매일 17:30에 실행되는 스케줄러 봇
├── scheduler-core.js        # 실제 비활성 유저 검사 및 알림 로직
├── db.js                    # SQLite DB 함수들 (get/set/insert 등)
├── init-db.js               # DB 초기화용 스크립트 (필요시 수동 실행)
├── database.sqlite          # SQLite 실제 DB 파일
├── .env                     # 환경변수 (봇 토큰 등)
├── package.json             # 프로젝트 설정 및 의존성 목록
└── README.md                # 기능 설명 및 설치 안내
```

## 봇 최소 권한
- View Channels
- Send Messages
- Connect (음성 채널 접속 확인용)
- Use Slash Commands

## 주의 사항
- 이 봇은 서버 내 관리자만 사용 가능하도록 설계되어 있습니다.
- Server Members Intent를 Discord Developer Portal > Bot 탭에서 반드시 활성화해야 합니다.

## 문의 및 개선 & 라이센스
- Discord DM: rekenzo#3030
- Discord Server: https://discord.gg/uAGEF3wy
- 라이센스: MIT (필요 시 명시)
