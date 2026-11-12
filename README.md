# 에러 코드 포털

공식 소프트웨어 문서에서 수집한 코드 4,836개의 검색·조회 포털입니다. 코드 하나당 정적 HTML 페이지 하나를 제공합니다.

- 공개 주소: https://nanalab.kr/error-code-directory/
- Windows Win32, Installer 반환 코드·메시지, WinHTTP, WinINet, Microsoft Entra ID
- Node.js, PostgreSQL, SQLite, Python, Firebase Authentication Admin SDK, Google APIs/gRPC, Cloudflare HTTP, GitHub REST validation
- 코드·원문 설명·한국어 제품 문맥·공식 해결/진단/참고 링크
- 업체·제품 필터, 브라우저 내 검색, 코드·주소 복사, JavaScript 없이 탐색 가능한 페이지 목록

## 개발·빌드

Node.js 22 이상. 외부 npm 패키지는 없습니다. 검증된 데이터는 `data/`에 포함됩니다.

```sh
npm run build
npm run check
npm test
python tools/serve.py
```

미리보기: http://127.0.0.1:8788/error-code-directory/

GitHub Pages는 `main:/docs`를 배포합니다. 생성 파일 `docs/`를 함께 커밋합니다. 빌더는 소스·데이터로 결정적으로 생성하며 `--check`는 차이와 여분 파일을 검사합니다. `build-manifest.json`에 모든 공개 파일의 SHA-256을 남깁니다. 원본 수집 증거의 선택적 통합 스크립트 `tools/import_sources.py`는 워크스페이스 `.tools/error-code-portal-20261112/{microsoft,platforms,vendors}`에서 검증 완료된 수집물을 가져옵니다. 보통 빌드에는 이 외부 폴더가 필요하지 않습니다.

## 범위·출처

수집일 2026-11-12. 오류 4,699건, 경고·상태 137건. 14개 제품, 공식 출처 84건. 모든 소프트웨어 오류의 전체 목록이나 실시간 동기화 서비스는 아닙니다. 버전·발생 환경은 각 원문을 확인해야 합니다. 원문 설명은 영어로 유지합니다.

Windows Installer 메시지 번호와 반환 코드는 별도 네임스페이스입니다. Win32·Installer 반환 코드에는 공식 HRESULT_FROM_WIN32 규칙으로 검색 별칭을 추가합니다. 메시지 번호에는 적용하지 않습니다.

`solution_links.kind`는 `troubleshooting`, `diagnostic-guide`, `reference`입니다. 각각 코드별 해결 절차, 제품 공통 진단, 코드 정의를 구분합니다. 참고 문서만 있는 항목을 검증된 해결책으로 표시하지 않습니다. 다른 제품의 같은 번호는 별도 페이지입니다.

`data/sources.json`과 각 코드 페이지에 원문 URL·저작자·라이선스·변경 내역·확인일·원문 해시를 보존합니다. 라이선스 전문은 `data/notices/`와 공개 `licenses/notices/`에 보존합니다. 원문 HTML은 실행·배포하지 않습니다. 원문 문구의 권리는 각 출처에 있으며, 애플리케이션 소스의 MIT 라이선스와 별개입니다.

## 게시자 통합·개인정보

`src/publisher.mjs`에서 NaNa Lab의 검증된 GA4, GTM, AdSense, Cloudflare ID를 모든 HTML에 삽입합니다. GTM noscript와 중앙 도서 배너도 포함합니다. 검색어는 메모리 안에서 처리하고 URL·통계 이벤트·검색 요청으로 전송하지 않습니다. GA4 주소는 쿼리·해시를 제외합니다. 로컬 미리보기 서버는 게시자·배너 스크립트와 GTM iframe을 제거하고 CSP로 외부 요청을 차단합니다. 분석·광고·외부 문서 관련 고지는 공개 개인정보 페이지에 있습니다.

테스트는 검색·필터·복사·실패 처리, 로컬 게시자 차단, 전 HTML 태그·출처·라우트·사이트맵을 확인합니다. 실제 브라우저 화면과 외부 서비스의 수집·색인 완료는 별도 검증 대상입니다.
