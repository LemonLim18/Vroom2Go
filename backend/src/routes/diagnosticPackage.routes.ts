import { Router } from 'express';
import { getDiagnosticPackages, getDiagnosticPackageById } from '../controllers/diagnosticPackage.controller';

const router = Router();

router.get('/', getDiagnosticPackages);
router.get('/:id', getDiagnosticPackageById);

export default router;
