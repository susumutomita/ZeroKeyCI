# Deploy Workflow Refactoring Guide

## Issue #9: Remove Hardcoded Script from deploy.yml

### Problem
The `.github/workflows/deploy.yml` file contains a large TypeScript script hardcoded directly in the workflow (lines 74-151). This creates several issues:
- Code duplication (similar functionality exists in `scripts/create-safe-proposal.ts`)
- Difficult to maintain and test
- Makes the workflow file unnecessarily long and complex
- Violates separation of concerns

### Solution
Replace the hardcoded script with a call to the existing `scripts/create-safe-proposal.ts`, which already has all the necessary functionality and more:
- Proper error handling
- YAML configuration parsing
- GitHub Actions output support
- Environment variable validation
- Comprehensive logging

### Updated Workflow Configuration

Replace the "Generate Safe proposal" step (lines 63-158 in the original file) with this simplified version:

```yaml
      - name: Generate Safe proposal
        id: create-proposal
        env:
          SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
          GITHUB_PR_NUMBER: ${{ github.event.pull_request.number }}
          GITHUB_SHA: ${{ github.sha }}
          GITHUB_ACTOR: ${{ github.actor }}
          GITHUB_PR_AUTHOR: ${{ github.event.pull_request.user.login }}
          GITHUB_WORKFLOW: ${{ github.workflow }}
          GITHUB_RUN_ID: ${{ github.run_id }}
          GITHUB_RUN_NUMBER: ${{ github.run_number }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          echo "🔐 Creating Safe transaction proposal..."
          bun run scripts/create-safe-proposal.ts

          # Extract outputs for subsequent steps
          PROPOSAL_HASH=$(cat safe-proposal.json | jq -r '.validationHash')
          echo "proposal_hash=$PROPOSAL_HASH" >> $GITHUB_OUTPUT
```

### Key Changes

1. **Removed Lines 74-154**: The entire hardcoded TypeScript script
2. **Simplified to Script Call**: Single line `bun run scripts/create-safe-proposal.ts`
3. **Environment Variables**: Moved from inline script to proper `env:` block
4. **Output Extraction**: Kept the GitHub Actions output setting using jq

### Benefits

- Maintainability - Script can be tested and modified independently
- Reusability - Same script can be used locally or in other workflows
- Testability - Existing unit tests cover the script functionality
- Clarity - Workflow file focuses on orchestration, not implementation
- DRY Principle - No code duplication between workflow and scripts

### Migration Steps

1. **バックアップ Current Workflow**:
   ```bash
   cp .github/workflows/deploy.yml .github/workflows/deploy.yml.backup
   ```

2. **Update deploy.yml**:
   Replace the "Generate Safe proposal" step with the simplified version above

3. **Test the Workflow**:
   - Create a test PR with the 'deploy' label
   - Merge to main
   - Verify the workflow runs successfully
   - Check that safe-proposal.json is generated correctly

4. **Verify Outputs**:
   Ensure subsequent steps still receive the correct outputs:
   - `steps.create-proposal.outputs.proposal_hash`
   - Other outputs from safe-proposal.json

### Verification

After updating the workflow, verify:

- [ ] Workflow triggers correctly on PR merge with 'deploy' label
- [ ] Safe proposal is created successfully
- [ ] safe-proposal.json artifact is uploaded
- [ ] PR comment is posted with correct proposal details
- [ ] All environment variables are passed correctly
- [ ] GitHub Actions outputs work for subsequent steps

### Notes

Important: Due to GitHub App permissions, this workflow file cannot be automatically updated. Manual update is required.

### References

- Original workflow: `.github/workflows/deploy.yml:63-158`
- Replacement script: `scripts/create-safe-proposal.ts`
- Issue: #9
- Exec plan: `plans.md` "Refactor deploy.yml to Remove Hardcoded Script"
