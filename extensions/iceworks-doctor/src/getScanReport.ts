import * as vscode from 'vscode';
import { Doctor } from '@iceworks/doctor';
import * as common from '@iceworks/common-service';
import { projectPath } from '@iceworks/project-service';
import getRecorder from './getRecorder';
import setDiagnostics from './setDiagnostics';

const doctor = new Doctor({ ignore: ['.vscode', '.ice', 'mocks', '.eslintrc.js', 'webpack.config.js'] });

let user = { empId: vscode.env.machineId, account: 'anonymous' };
async function updateUser() {
  const isAliInternal = await common.checkIsAliInternal();
  if (isAliInternal) {
    user = await common.getUserInfo();
  }
}
updateUser();

export default async (options) => {
  let report;
  let targetPath = projectPath;
  try {
    if (options && options.targetPath) {
      targetPath = options.targetPath;
    }
    report = await doctor.scan(targetPath, options);
    // Set VS Code problems
    setDiagnostics(report.securityPractices, true);
    // Record data
    getRecorder().record({
      module: 'main',
      action: 'doctor',
      data: {
        userName: user.account,
        userId: user.empId,
        projectPath,
        score: report.score,
        aliEslint: report.aliEslint.score,
        bestPractices: report.bestPractices.score,
        securityPractices: report.securityPractices.score,
        maintainability: report.maintainability.score,
        repeatability: report.repeatability.score,
      },
    });
  } catch (e) {
    console.log(e);
    report = {
      error: e,
    };
  }

  return report;
};
