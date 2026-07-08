# Schedule a one-off delayed prompt
# Auto-generated from scripts/demos.json — edit that file, then re-run npm run create:tape

Output public/images/chat/after.gif

Set FontSize 15
Set Width 800
Set Height 500
Set Theme "Dracula"
Set Padding 20
Set BorderRadius 8
Set Margin 10
Set MarginFill "#282a36"
Set Framerate 15
Set TypingSpeed 150ms

# First visible command in the recording must be 'copilot'.
# Trust the folder once manually before first recording session:
#   copilot   (pick option 2 to remember)
Type "copilot"
Enter
Sleep 5s
# Enable experimental mode first (required for /after)
Type "/experimental on"
Enter
Sleep 5s
# Run: /after 10m check if the build finished
Type "/after 10m check if the build finished"
Sleep 3s
Enter
Sleep 0.8s

# Wait for the real response
Sleep 6s

# End of recording
Sleep 2s
