# Set a focused autopilot objective for the session
# Auto-generated from scripts/demos.json — edit that file, then re-run npm run create:tape

Output public/images/agents/autopilot.gif

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
# Wait until Copilot is ready, however long loading takes (see "speedUp" in demos.json).
Wait+Screen@120s /Interactive/
Sleep 1s
Type "/autopilot fix all TypeScript errors in src/"
Sleep 3s
Enter
Sleep 4s
Enter
Sleep 30s

# End of recording
Sleep 2s
