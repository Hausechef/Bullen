## Цель

Привести весь проект к единому **dark premium** виду (чёрный + золото `#D4AF37`), починить общие baseline-проблемы и пройтись по трём зонам: Login → Trading → CRM.

## Текущие проблемы (по аудиту)

1. **Нет глобальной дизайн-системы.** `src/index.css` пустой (`@import "tailwindcss"`), а токены живут локально в `src/app/trading/index.css` и `src/app/crm/index.css` — но они не подключены к корневому `main.tsx`. Поэтому глобальные страницы (Login, Register, 403) и общие компоненты не имеют ни фона, ни шрифтов — отсюда «белый» лист на `/login`.
2. **Конфликт токенов.** В trading css `--color-accent-primary: #3b82f6` (синий!), хотя визуально нужен золотой. CRM использует свой `--color-aura-gold`. Нужны единые семантические токены.
3. **Tailwind v4 (`@tailwindcss/vite`)** — токены задаются через `@theme`, нет `tailwind.config.ts`. Оставляем v4, но переписываем `@theme` в одном месте.
4. **Login**: фон-картинка не покрывает экран на десктопе (показывает белое сверху), input'ы светло-серые на тёмной карточке — диссонанс, иконки `text-black/70` нечитаемы на светлом инпуте.
5. **Trading dashboard**: смешение токенов, неравные отступы между виджетами, sidebar widgets хаотичны, таблица позиций — без zebra и hover-состояний, chart-контейнер без рамки.
6. **CRM**: Playfair Display только в CRM (везде остальное sans), Layout не унифицирован с Trading-сайдбаром, страницы (`Dashboard`, `Managers`, `AgentWorkspace`) имеют разный padding/heading-стиль.

## План работ

### Этап 1 — Глобальная design-система (фундамент)
- Переписать `src/index.css`: единые `@theme` токены — `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-text`, `--color-muted`, `--color-gold`, `--color-gold-soft`, `--color-success`, `--color-danger`, `--color-warning`, плюс типографика (Playfair Display для display/serif, Inter для sans), радиусы, тени.
- Подключить шрифты Google Fonts глобально.
- Базовые `body`, `*` стили (антиалиасинг, scrollbar, focus-ring золотой).
- Утилиты: `.surface`, `.surface-hover`, `.gold-gradient-text`, `.glass`, `.btn-gold`, `.btn-ghost`, `.input-dark`.
- `src/app/trading/index.css` и `src/app/crm/index.css` → переписать на reference глобальных токенов (убрать дубликаты, оставить только специфичные алиасы).

### Этап 2 — Login + публичные страницы
- Чёрный фон + центрированная композиция; bull-картинка как мягкая подложка с радиальным gradient overlay (а не cover-фон с белыми полями).
- Inputs: тёмные (`surface-2`), золотой фокус-ring, иконки `text-muted`.
- Кнопка «Log In»: золотой фон, чёрный текст, hover scale; «Apply Here» — текст-ссылка золотая.
- Применить ту же оболочку к `/register`, `/forgot-password`, `/reset-password`, `/unauthorized`.

### Этап 3 — Trading-дашборд
- Унифицировать Sidebar (свернуть/развернуть, активный пункт золотой бордер слева, иконки от lucide).
- Topbar: search + balance pill + notification + avatar.
- Grid дашборда: 12-колонок, чёткие промежутки (`gap-6`), карточки `surface` с `rounded-2xl border-border`.
- Таблица позиций: sticky header, zebra rows, hover, цветные P/L (success/danger).
- TradingChart: золотая рамка-glow, скругление 16px.
- Виджеты (Gamification, Universe banners, Secondary): единый стиль карточек и заголовков.

### Этап 4 — CRM
- Заменить локальный `Layout.tsx` на единый AppShell (тот же Sidebar/Topbar что у Trading, но с CRM-навигацией: Dashboard, Manager, Workspace, Calls, Clients, Reports, Admin).
- Унифицировать страницы: один компонент `PageHeader` (h1 Playfair + subtitle muted), карточки `surface`, таблицы единого стиля.
- Привести кнопки/бейджи/модалки в `crm/components/ui/*` к общему стилю.

### Этап 5 — Проверка
- Скриншоты Login / Trading / CRM в desktop viewport.
- Проверка console на ошибки.

## Технические детали

- Tailwind v4, токены через `@theme` в `src/index.css`. `tailwind.config.ts` не создаём — он не нужен в v4.
- Все цвета — через семантические классы (`bg-surface`, `text-gold`), без хардкода `#d4af37` в компонентах.
- Анимации — `motion/react` (уже установлен), 200-300мс ease-out, без перебора.
- Никаких новых зависимостей.

## Что НЕ входит

- Не трогаем бизнес-логику, auth-flow, supabase-запросы, маршруты.
- Не добавляем новые страницы или фичи.
- Не подключаем shadcn/ui (проект на собственных ui-компонентах, ломать архитектуру не будем).

## Объём

~15–25 файлов, 4 крупных этапа. Если хочешь — могу делать поэтапно с показом после каждого этапа, или прогнать все 4 за раз.
