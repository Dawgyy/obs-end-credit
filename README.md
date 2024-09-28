
# OBS End Credit

This project is a dynamic end credit script designed for use with OBS Studio. It displays the names of recent subscribers and followers in a visually appealing manner, featuring scrolling credits with a custom background video. The project is powered by JavaScript, Node.js, Tailwind CSS, and a custom server that interacts with the Twitch API to retrieve follower and subscriber information.

## Features

- **Live Updates**: Automatically fetches and displays the latest Twitch followers and subscribers.
- **Scrolling Credits**: The credits scroll smoothly on screen, perfect for end-of-stream sequences in OBS.
- **Custom Background Video**: The background video provides a dynamic and visually engaging experience for viewers.
- **User Attribution**: Differentiates between followers and subscribers to show appreciation to the audience.
- **No External Dependencies**: All assets, including CSS, are managed locally to ensure fast and reliable performance.

## Setup Instructions

### Requirements

- Node.js (v14 or higher recommended)
- npm or yarn
- OBS Studio

### Getting Started

1. **Clone the repository**:
   ```sh
   git clone git@github.com:Dawgyy/obs-end-credit.git
   cd obs-end-credit
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory with the following variables:
   ```sh
   CLIENT_ID=your_twitch_client_id
   CLIENT_SECRET=your_twitch_client_secret
   BROADCASTER_ID=your_twitch_broadcaster_id
   PORT=3030 # Optional, default is 3030
   ```

4. **Run the server**:
   ```sh
   node server.js
   ```

5. **Use in OBS**:
   - Add a "Browser Source" to your scene in OBS Studio.
   - Set the URL to `http://localhost:3030`.
   - Adjust the width and height as needed to fit your stream layout.

### File Structure

```
.
├── package.json
├── package-lock.json
├── public
│   ├── index.html         # HTML file for the credits display
│   ├── script.js          # JavaScript to fetch and display data from the server
│   ├── styles.css         # Custom CSS for styling the credits
│   ├── tailwind.css       # Tailwind CSS file for additional styling
│   └── vid.mp4            # Background video file
├── server.js              # Node.js server to interact with the Twitch API
├── tailwind.config.js     # Tailwind CSS configuration file
└── .env                   # Environment variable configuration (not committed)
```

### Tailwind CSS Setup

The project uses Tailwind CSS for styling. The custom styles are compiled locally. To compile Tailwind, run the following command:

```sh
npx tailwindcss -i ./styles.css -o ./public/tailwind.css --watch
```

This command will watch for changes and update the `tailwind.css` file accordingly.

### Twitch API Integration

The server uses the Twitch API to retrieve recent followers and subscribers:

- `/subs` endpoint to fetch subscriber information.
- `/followers` endpoint to fetch follower information.

The JavaScript (`script.js`) fetches data from these endpoints and dynamically adds the names to the HTML to display scrolling credits.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
