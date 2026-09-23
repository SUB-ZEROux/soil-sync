# 🌱 Soil Sync

> Smart farming. Shared knowledge. Sustainable futures.

Soil Sync is a responsive farmers' community platform designed to help growers share crop photos, exchange practical advice, and connect with buyers or agricultural support services. The project combines a lightweight front-end experience with a small Node.js API that stores uploaded crop posts, comments, and contact messages.

<div align="center">

![Soil Sync preview](https://placehold.co/1200x500/e0f2f1/2d5016?text=Soil+Sync+%7C+Farmers+Community)

**[Explore the demo](https://sub-zeroux.github.io/soil-sync/)** · **[Report an issue](https://github.com/SUB-ZEROux/soil-sync/issues)**

</div>

## ✨ Features

- 📸 Upload crop photos with a description and location
- 💬 Post and view community comments on crop entries
- 🌾 Browse crop and soil education cards
- 🤝 Send buyer or support inquiries through the contact form
- 📱 Responsive layout for mobile, tablet, and desktop screens
- ⚙️ Persistent backend storage using SQLite and local image uploads

## 🧱 Project structure

```text
soil-sync/
├── index.html          # Front-end experience and client-side behavior
├── README.md           # Project overview and setup guide
├── backend/
│   ├── src/
│   │   └── server.js   # Express API and SQLite persistence
│   ├── .env.example    # Sample environment variables
│   ├── package.json    # Node.js dependencies and scripts
│   └── README.md      # Backend-specific setup notes
└── .gitignore
```

## 🚀 Quick start

### 1) Run the frontend

This project works as a static HTML page, so you can open `index.html` directly in a browser or serve the root with a local web server.

```bash
git clone https://github.com/SUB-ZEROux/soil-sync.git
cd soil-sync
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

### 2) Run the API

The backend requires Node.js 20+.

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API will run at `http://localhost:3000`.

## 🔌 Frontend-to-backend setup

The front-end script in `index.html` automatically checks whether the current page is served locally and points to:

- `http://localhost:3000` when running locally
- `https://soil-sync-api.onrender.com` when deployed outside localhost

If you are using a different backend host, update the `API_BASE` value in the script near the bottom of `index.html`.

## 🗂️ API overview

The backend exposes the following endpoints:

- `GET /api/health` — health check
- `GET /api/crops?limit=20&offset=0` — list crop posts and comments
- `POST /api/crops` — upload a crop photo and metadata
- `POST /api/crops/:id/comments` — add a comment to a crop
- `POST /api/contact` — submit a contact message
- `GET /uploads/<filename>` — serve uploaded images

## 🛠️ Technology stack

- **HTML5** for structure and semantic markup
- **CSS3** for responsive and accessible styling
- **Vanilla JavaScript** for UI behavior and API calls
- **Node.js + Express** for the backend API
- **SQLite** for lightweight persistent data storage
- **Multer** for image uploads
- **Helmet, CORS, and rate limiting** for API hardening

## 🎨 Design direction

The interface uses a nature-inspired palette and soft card-based layout to make information feel approachable and trustworthy:

| Design choice | Purpose |
| --- | --- |
| 🌿 Deep greens | Signal agriculture, growth, and sustainability |
| 💧 Soft gradients | Create a fresh and open background |
| 🧊 Glass-style panels | Separate sections without heavy visual clutter |
| ✨ Gentle motion | Add polish while keeping the interface calm |
| 📐 Responsive cards | Ensure usability on small and large screens |
| 🔤 Poppins + Inter | Blend expressive headings with readable body text |

## 🔧 Customization

Most content can be updated directly in `index.html`:

- Replace hero and section text
- Update the color palette in the CSS variables
- Revise the crop education cards and gallery content
- Adjust form labels and button copy
- Point the app to a custom backend URL in the JavaScript config

For backend configuration, edit `backend/.env.example` or copy it to a local `.env` file in `backend/`.

## 🌍 Deployment

Because the front-end is static, it can be deployed to GitHub Pages, Netlify, Vercel, or any static host. The API can be deployed separately to a Node.js-compatible host such as Render or Railway.

## 🤝 Contributing

Ideas and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and test them locally.
4. Commit clearly and submit a pull request.

## 📄 License

No license has been selected for this project yet. Add a license file before broadly sharing or reusing the code.

---

<div align="center">

🌱 **Together we grow, together we thrive.** 🌱

</div>
