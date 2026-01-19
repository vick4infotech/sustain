import { NextResponse } from 'next/server';

import { requireSession, requireCsrfTokenFromForm, requestContext } from '@/api/auth/session';
import { recordAuditEvent } from '@/api/audit/audit';
import {
  updateTalentProfileMain,
  addSkill,
  removeSkill,
  addExperience,
  removeExperience,
  addEducation,
  removeEducation,
  addCertification,
  removeCertification,
  addLink,
  removeLink,
} from '@/api/talent/profile';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await requireSession(['TALENT']);
  const form = await request.formData();
  await requireCsrfTokenFromForm(form);

  const action = String(form.get('action') || '').trim();

  try {
    switch (action) {
      case 'update_main': {
        updateTalentProfileMain(session.user.id, {
          fullName: String(form.get('fullName') || ''),
          headline: String(form.get('headline') || ''),
          about: String(form.get('about') || ''),
          locationCountry: String(form.get('locationCountry') || ''),
          locationCity: String(form.get('locationCity') || ''),
          languages: String(form.get('languages') || ''),
          interests: String(form.get('interests') || ''),
          profileVisibility: String(form.get('profileVisibility') || '') === 'on',
        });
        break;
      }
      case 'add_skill': {
        addSkill(session.user.id, String(form.get('skillName') || ''));
        break;
      }
      case 'remove_skill': {
        removeSkill(session.user.id, String(form.get('skillName') || ''));
        break;
      }
      case 'add_experience': {
        addExperience(session.user.id, {
          title: String(form.get('title') || ''),
          organisation: String(form.get('organisation') || ''),
          location: String(form.get('location') || ''),
          startDate: String(form.get('startDate') || ''),
          endDate: String(form.get('endDate') || ''),
          isCurrent: String(form.get('isCurrent') || '') === 'on',
          description: String(form.get('description') || ''),
        });
        break;
      }
      case 'remove_experience': {
        removeExperience(session.user.id, Number(form.get('experienceId') || 0));
        break;
      }
      case 'add_education': {
        const startYear = String(form.get('startYear') || '').trim();
        const endYear = String(form.get('endYear') || '').trim();
        addEducation(session.user.id, {
          institution: String(form.get('institution') || ''),
          degree: String(form.get('degree') || ''),
          field: String(form.get('field') || ''),
          startYear: startYear ? Number(startYear) : null,
          endYear: endYear ? Number(endYear) : null,
          description: String(form.get('description') || ''),
        });
        break;
      }
      case 'remove_education': {
        removeEducation(session.user.id, Number(form.get('educationId') || 0));
        break;
      }
      case 'add_cert': {
        const issueYear = String(form.get('issueYear') || '').trim();
        const expiresYear = String(form.get('expiresYear') || '').trim();
        addCertification(session.user.id, {
          name: String(form.get('name') || ''),
          issuer: String(form.get('issuer') || ''),
          issueYear: issueYear ? Number(issueYear) : null,
          expiresYear: expiresYear ? Number(expiresYear) : null,
        });
        break;
      }
      case 'remove_cert': {
        removeCertification(session.user.id, Number(form.get('certId') || 0));
        break;
      }
      case 'add_link': {
        addLink(session.user.id, {
          label: String(form.get('label') || ''),
          url: String(form.get('url') || ''),
        });
        break;
      }
      case 'remove_link': {
        removeLink(session.user.id, Number(form.get('linkId') || 0));
        break;
      }
      default:
        return NextResponse.redirect(new URL('/talent/profile?error=unknown_action', request.url));
    }

    const { ip, userAgent } = await requestContext();
    recordAuditEvent({
      actorUserId: session.user.id,
      action: 'UPDATE_TALENT_PROFILE',
      entityType: 'USER',
      entityId: session.user.id,
      metadata: { profileAction: action },
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.redirect(new URL('/talent/profile?saved=1', request.url));
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/talent/profile?error=${encodeURIComponent(e?.message || 'unknown')}`, request.url));
  }
}
