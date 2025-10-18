/**
 * Lit Action: Conditional Safe Transaction Signer
 *
 * This Lit Action implements conditional signing logic for Safe transactions.
 * It verifies that all required conditions are met before signing:
 * - OPA policy validation passes
 * - All tests pass
 * - PR is merged
 * - GitHub API verification succeeds
 *
 * Security:
 * - PKP private key never leaves Lit Protocol's distributed network
 * - All validation happens inside the Lit Action (trusted execution)
 * - Complete audit trail logged
 *
 * Usage:
 * This code runs inside Lit Protocol's decentralized network when
 * LitPKPSigner.signSafeTransaction() is called.
 */

// Type definitions for Lit Actions environment
declare const LitActions: {
  signEcdsa: (params: {
    toSign: Uint8Array;
    publicKey: string;
    sigName: string;
  }) => Promise<void>;
  setResponse: (params: { response: string }) => void;
};

interface GitHubAPIParams {
  repoOwner: string;
  repoName: string;
  prNumber: number;
  githubToken: string;
}

interface OPAPolicyParams {
  policyEndpoint: string;
  deploymentConfig: Record<string, unknown>;
}

interface TestResultsParams {
  testResultsUrl: string;
}

interface SigningConditions {
  opaPolicyPassed: boolean;
  testsPassed: boolean;
  prMerged: boolean;
  deploymentConfig?: Record<string, unknown>;
}

interface LitActionParams {
  // Transaction data to sign
  dataToSign: Uint8Array;
  publicKey: string;

  // Signing conditions
  conditions: SigningConditions;

  // GitHub API parameters
  github: GitHubAPIParams;

  // OPA policy parameters
  opa: OPAPolicyParams;

  // Test results parameters
  tests: TestResultsParams;
}

/**
 * Verify GitHub PR is merged
 */
async function verifyPRMerged(github: GitHubAPIParams): Promise<boolean> {
  try {
    const url = `https://api.github.com/repos/${github.repoOwner}/${github.repoName}/pulls/${github.prNumber}`;

    console.log(`[Lit Action] Verifying PR merged: ${url}`);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${github.githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      console.error(
        `[Lit Action] GitHub API error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();

    // Check if PR is merged
    const isMerged = data.merged === true;
    const mergedAt = data.merged_at;

    console.log(`[Lit Action] PR #${github.prNumber} merged: ${isMerged}`);
    if (isMerged && mergedAt) {
      console.log(`[Lit Action] Merged at: ${mergedAt}`);
    }

    return isMerged;
  } catch (error) {
    console.error('[Lit Action] Error verifying PR merged:', error);
    return false;
  }
}

/**
 * Verify OPA policy passes
 */
async function verifyOPAPolicy(opa: OPAPolicyParams): Promise<boolean> {
  try {
    console.log(`[Lit Action] Verifying OPA policy: ${opa.policyEndpoint}`);

    const response = await fetch(opa.policyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: opa.deploymentConfig,
      }),
    });

    if (!response.ok) {
      console.error(
        `[Lit Action] OPA API error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();

    // OPA returns { result: { allow: true/false } }
    const allowed = data.result?.allow === true;

    console.log(`[Lit Action] OPA policy result: ${allowed ? 'PASS' : 'FAIL'}`);

    if (!allowed && data.result?.violations) {
      console.error('[Lit Action] OPA violations:', data.result.violations);
    }

    return allowed;
  } catch (error) {
    console.error('[Lit Action] Error verifying OPA policy:', error);
    return false;
  }
}

/**
 * Verify all tests passed
 */
async function verifyTestsPassed(tests: TestResultsParams): Promise<boolean> {
  try {
    console.log(`[Lit Action] Verifying tests: ${tests.testResultsUrl}`);

    const response = await fetch(tests.testResultsUrl);

    if (!response.ok) {
      console.error(
        `[Lit Action] Test results API error: ${response.status} ${response.statusText}`
      );
      return false;
    }

    const data = await response.json();

    // Expected format: { conclusion: "success" | "failure", ... }
    const testsPassed = data.conclusion === 'success';

    console.log(
      `[Lit Action] Tests result: ${testsPassed ? 'PASS' : 'FAIL'}`
    );

    if (!testsPassed && data.details) {
      console.error('[Lit Action] Test failures:', data.details);
    }

    return testsPassed;
  } catch (error) {
    console.error('[Lit Action] Error verifying tests:', error);
    return false;
  }
}

/**
 * Main Lit Action execution
 *
 * This function runs inside Lit Protocol's trusted execution environment.
 * It verifies all conditions and only signs if everything passes.
 */
(async () => {
  try {
    console.log('[Lit Action] Starting conditional signing verification');

    // Get parameters (injected by Lit Protocol SDK)
    const params = (globalThis as any).params as LitActionParams;

    // Validate required parameters
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

    // Verify all conditions
    let allConditionsMet = true;
    const verificationResults = {
      opaPolicyPassed: false,
      testsPassed: false,
      prMerged: false,
    };

    // 1. Verify OPA policy (if enabled in conditions)
    if (params.conditions.opaPolicyPassed) {
      if (!params.opa) {
        console.error('[Lit Action] OPA parameters missing');
        allConditionsMet = false;
      } else {
        verificationResults.opaPolicyPassed = await verifyOPAPolicy(params.opa);
        if (!verificationResults.opaPolicyPassed) {
          console.error('[Lit Action] OPA policy check FAILED');
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] OPA policy check skipped (not required)');
      verificationResults.opaPolicyPassed = true;
    }

    // 2. Verify tests passed (if enabled in conditions)
    if (params.conditions.testsPassed) {
      if (!params.tests) {
        console.error('[Lit Action] Test parameters missing');
        allConditionsMet = false;
      } else {
        verificationResults.testsPassed = await verifyTestsPassed(params.tests);
        if (!verificationResults.testsPassed) {
          console.error('[Lit Action] Tests check FAILED');
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] Tests check skipped (not required)');
      verificationResults.testsPassed = true;
    }

    // 3. Verify PR is merged (if enabled in conditions)
    if (params.conditions.prMerged) {
      if (!params.github) {
        console.error('[Lit Action] GitHub parameters missing');
        allConditionsMet = false;
      } else {
        verificationResults.prMerged = await verifyPRMerged(params.github);
        if (!verificationResults.prMerged) {
          console.error('[Lit Action] PR merge check FAILED');
          allConditionsMet = false;
        }
      }
    } else {
      console.log('[Lit Action] PR merge check skipped (not required)');
      verificationResults.prMerged = true;
    }

    // Final decision
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

    // All conditions met - proceed with signing
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
