/**
 * Lit Action: Conditional Safe Transaction Signer (Compiled)
 *
 * This is the compiled JavaScript version for IPFS storage and Lit Protocol execution.
 * Source: src/lit-actions/conditionalSigner.ts
 */

(async () => {
  try {
    console.log('[Lit Action] Starting conditional signing verification');

    const params = globalThis.params;

    if (!params.dataToSign || !params.publicKey) {
      throw new Error('Missing required parameters: dataToSign or publicKey');
    }

    if (!params.conditions) {
      throw new Error('Missing signing conditions');
    }

    console.log('[Lit Action] Conditions provided:', {
      opaPolicyPassed: params.conditions.opaPolicyPassed,
      testsPassed: params.conditions.testsPassed,
      prMerged: params.conditions.prMerged,
    });

    let allConditionsMet = true;
    const verificationResults = {
      opaPolicyPassed: false,
      testsPassed: false,
      prMerged: false,
    };

    // Verify OPA policy
    if (params.conditions.opaPolicyPassed) {
      if (!params.opa) {
        console.error('[Lit Action] OPA parameters missing');
        allConditionsMet = false;
      } else {
        try {
          console.log(`[Lit Action] Verifying OPA policy: ${params.opa.policyEndpoint}`);
          const response = await fetch(params.opa.policyEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: params.opa.deploymentConfig }),
          });

          if (!response.ok) {
            console.error(`[Lit Action] OPA API error: ${response.status}`);
            allConditionsMet = false;
          } else {
            const data = await response.json();
            const allowed = data.result?.allow === true;
            console.log(`[Lit Action] OPA policy result: ${allowed ? 'PASS' : 'FAIL'}`);
            verificationResults.opaPolicyPassed = allowed;
            if (!allowed) {
              console.error('[Lit Action] OPA violations:', data.result?.violations);
              allConditionsMet = false;
            }
          }
        } catch (error) {
          console.error('[Lit Action] OPA verification error:', error);
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] OPA policy check skipped');
      verificationResults.opaPolicyPassed = true;
    }

    // Verify tests passed
    if (params.conditions.testsPassed) {
      if (!params.tests) {
        console.error('[Lit Action] Test parameters missing');
        allConditionsMet = false;
      } else {
        try {
          console.log(`[Lit Action] Verifying tests: ${params.tests.testResultsUrl}`);
          const response = await fetch(params.tests.testResultsUrl);

          if (!response.ok) {
            console.error(`[Lit Action] Test results API error: ${response.status}`);
            allConditionsMet = false;
          } else {
            const data = await response.json();
            const testsPassed = data.conclusion === 'success';
            console.log(`[Lit Action] Tests result: ${testsPassed ? 'PASS' : 'FAIL'}`);
            verificationResults.testsPassed = testsPassed;
            if (!testsPassed) {
              console.error('[Lit Action] Test failures:', data.details);
              allConditionsMet = false;
            }
          }
        } catch (error) {
          console.error('[Lit Action] Tests verification error:', error);
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] Tests check skipped');
      verificationResults.testsPassed = true;
    }

    // Verify PR is merged
    if (params.conditions.prMerged) {
      if (!params.github) {
        console.error('[Lit Action] GitHub parameters missing');
        allConditionsMet = false;
      } else {
        try {
          const url = `https://api.github.com/repos/${params.github.repoOwner}/${params.github.repoName}/pulls/${params.github.prNumber}`;
          console.log(`[Lit Action] Verifying PR merged: ${url}`);

          const response = await fetch(url, {
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `Bearer ${params.github.githubToken}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          if (!response.ok) {
            console.error(`[Lit Action] GitHub API error: ${response.status}`);
            allConditionsMet = false;
          } else {
            const data = await response.json();
            const isMerged = data.merged === true;
            console.log(`[Lit Action] PR #${params.github.prNumber} merged: ${isMerged}`);
            verificationResults.prMerged = isMerged;
            if (!isMerged) {
              allConditionsMet = false;
            }
          }
        } catch (error) {
          console.error('[Lit Action] PR verification error:', error);
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] PR merge check skipped');
      verificationResults.prMerged = true;
    }

    console.log('[Lit Action] Verification results:', verificationResults);

    if (!allConditionsMet) {
      const errorMessage = 'Signing conditions not met. Refusing to sign.';
      console.error(`[Lit Action] ${errorMessage}`);
      LitActions.setResponse({
        response: JSON.stringify({
          success: false,
          error: errorMessage,
          verificationResults,
        }),
      });
      throw new Error(errorMessage);
    }

    console.log('[Lit Action] All conditions met. Proceeding with signature.');

    await LitActions.signEcdsa({
      toSign: params.dataToSign,
      publicKey: params.publicKey,
      sigName: 'safeTxSig',
    });

    console.log('[Lit Action] Successfully signed Safe transaction');

    LitActions.setResponse({
      response: JSON.stringify({
        success: true,
        verificationResults,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Lit Action] Fatal error:', errorMessage);
    LitActions.setResponse({
      response: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    });
    throw error;
  }
})();
