### Troubleshooting: Error when Submitting PR Cost

If you encounter an issue while trying to submit the PR cost and receive the following error:

```javascript
Not Found - https://docs.github.com/rest/pulls/pulls#get-a-pull-request
```

Please follow these steps to resolve the issue:

1. **Check the Repository Connection**:

   - Ensure that the repository you are working on is connected to the **PR Time Tracker** configuration.

2. **Request Admin Assistance**:

   - If you're not sure how to verify the repository's connection, ask your organization Admin to confirm whether the repository is correctly linked to the PR Time Tracker.

3. **New Repository Configuration**:
   - Every time a new repository is created, it must be manually verified and connected to the **PR Time Tracker** configuration.
   - Alternatively, the Admin can set the `Allow all repos` option in the PR Time Tracker configuration to automatically resolve this issue for future repositories.
