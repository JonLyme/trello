# Trello-W realtime ticket comments

## Feature: realtime ticket comment chat

### Overview

The ticket comment button in `SortableTicket.jsx` opens `CommentModal.jsx`. The modal is connected to a WebSocket server. Workspace members and invited users can communicate in real time on the same ticket.

### Frontend implementation

- `SortableTicket.jsx` keeps the existing comment button and passes `ticket.id` into `CommentModal`.
- `CommentModal.jsx` creates a WebSocket connection to `ws://localhost:8080`.
- When a user presses the send button, the client sends:
  - `type: ticket_comment`
  - `ticket_id`
  - `user_id`
  - `message`
- Incoming comments are filtered by ticket id and rendered immediately.

### Backend implementation

- `server/src/server.js` now uses the WebSocket server as a realtime comment gateway.
- When a `ticket_comment` event arrives:
  1. The message is inserted into the `comments` table.
  2. The saved comment is loaded with sender name and avatar information.
  3. The event is broadcast to connected users.

### Notification behavior

`CommentNotifications.jsx` keeps a background WebSocket connection while a user is logged in. If another workspace member posts a comment while the user is viewing another page, a toast notification appears:

`[sender] adds 1 comments`

### Database

The existing `comments` table is used:

- `ticket_id` links the message to a ticket.
- `user_id` stores the sender.
- `message` stores the comment content.
- `created_at` stores message time.
