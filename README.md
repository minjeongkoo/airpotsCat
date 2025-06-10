# 🐱 에어팟 고양이 봇

디스코드 서버에서 **음성 채널에 일정 기간 동안 참여하지 않은 유저**를 감지하고,
**관리자에게 DM으로 알림을 보내는 자동화된 디스코드 봇**입니다.

> 서버 운영자가 장기 미참여자를 파악하거나, 비활성 멤버를 관리하는 데 도움을 줍니다.

## 디코 설정
- 관리자로 등록하신 분은 Discord > 설정 > 콘텐츠 및 소셜 > 소셜 권한 > "해당 서버"의 [다이렉트 메시지: True]
- 위 설정을 켜주셔야 DM을 받으실 수 있어요.
- 매일 아침 7시에 자동 알림이 있습니다.

---

## 기능 요약

- *이 붙은 항목은 필수 설정 항목입니다. 설정하지 않을 시, 작동하지 않습니다.

- `/참여일 [일수]` – 비활성 기준일 설정* (예: '60'으로 설정하면 60일간 음성 채팅에 참여하지 않은 사람을 찾아줌.)
- `/관리자 @유저` – 알림 받을 관리자 등록*
- `/관리자목록` – 등록된 관리자 목록 보기
- `/제외 @유저` – 비활성 감지에서 제외할 유저 지정
- `/제외목록` – 제외된 유저 목록 보기
- `/상태확인` – 현재 서버 설정(기준일, 관리자, 제외 대상) 확인
- `/초기화` – 서버 설정 초기화


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
airpodsCat/
├── commands.js            # 슬래시 명령어 정의 및 처리
├── db.js                  # SQLite 기반 DB 모듈
├── scheduler.js           # 비활성 유저 감지 스케줄러
├── index.js               # 봇 메인 엔트리포인트
├── deploy-commands.js     # 슬래시 명령어 등록 스크립트
├── database.sqlite        # 데이터베이스 파일 (자동 생성됨)
├── .env                   # 환경 변수 파일
└── README.md              # 이 문서
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
