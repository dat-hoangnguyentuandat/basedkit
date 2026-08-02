# BaseKit

BaseKit la bo engineer kit dung chung cho Claude Code va Codex. Prefix lenh la
`bk`, cau hinh BaseKit nam trong `.bk.json` va danh sach thu muc bo qua nam
trong `.bkignore`.

## Cai dat

Mo terminal tai thu muc goc cua du an can cai, sau do chay:

```sh
curl -fsSL https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.sh | sh
```

Installer se hoi mot trong ba lua chon:

1. Claude Code
2. Codex
3. Ca hai

Khong can tao `.claude` hay `.codex` truoc. Installer tu kiem tra va tao thu
muc con thieu; neu thu muc da ton tai, BaseKit duoc merge vao noi dung hien co.

Tren Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.ps1 | iex
```

Yeu cau Node.js 18 tro len. Ban POSIX can them `curl` va `tar`.

## Cai khong tuong tac

Dung trong CI hoac khi da biet provider:

```sh
curl -fsSL https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.sh \
  | BASEKIT_PROVIDER=codex sh
```

Gia tri hop le cua `BASEKIT_PROVIDER` la `claude`, `codex`, hoac `both`. Co the
tro toi du an khac bang `BASEKIT_TARGET`:

```sh
curl -fsSL https://raw.githubusercontent.com/dat-hoangnguyentuandat/basekit/main/install.sh \
  | BASEKIT_PROVIDER=both BASEKIT_TARGET=/path/to/project sh
```

## Noi dung duoc cai

### Claude Code

- Agents, commands, hooks, rules, workflows, scripts va skills trong `.claude/`.
- Cau hinh `.claude/.bk.json` va `.claude/.bkignore`.
- Hooks va status line duoc merge vao `.claude/settings.json`.

### Codex

- Codex agents da chuyen sang TOML trong `.codex/agents/`.
- Skills va commands da chuyen doi trong `.agents/skills/`, la vi tri Codex doc
  skill theo scope repository.
- Rules va workflows duoc merge vao `AGENTS.md` trong khoi co marker BaseKit.
- Agent registry duoc merge vao `.codex/config.toml`.
- Payload ho tro nam trong `.codex/basekit/`.

## Cap nhat va xung dot

Chay lai dung lenh cai dat de cap nhat. Manifest duoc luu tai
`.claude/.basekit/manifest.json` hoac `.codex/.basekit/manifest.json`.

- File BaseKit chua bi sua se duoc cap nhat.
- File cua nguoi dung khong bi xoa.
- Neu file BaseKit da duoc tuy bien, installer giu ban hien tai va dat ban moi
  trong thu muc `.basekit/conflicts/` de review thu cong.
- Cac khoi BaseKit trong `AGENTS.md`, `.codex/config.toml` va hook Claude duoc
  merge theo cach idempotent, khong nhan doi sau moi lan chay.

## Luu y giay phep

Bon skill tai lieu Anthropic `docx`, `pdf`, `pptx` va `xlsx` khong nam trong
repository cong khai vi license kem theo cam tao ban phai sinh va phan phoi cho
ben thu ba. Installer khong xoa cac ban da ton tai tren may nguoi dung.

Thong tin license cua cac skill ben thu ba con lai nam trong tung thu muc skill
va tai [`engineer/skills/THIRD_PARTY_NOTICES.md`](engineer/skills/THIRD_PARTY_NOTICES.md).
