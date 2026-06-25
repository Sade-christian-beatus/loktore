import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Jeu de données initial pour le développement (miroir des données de démo du front).
async function main() {
  const passwordHash = await bcrypt.hash('password123', 12)

  // Patient de test
  const patient = await prisma.profile.upsert({
    where: { email: 'patient@loktore.bf' },
    update: {},
    create: {
      email: 'patient@loktore.bf',
      passwordHash,
      fullName: 'Awa Compaoré',
      role: 'patient',
      preferredLanguage: 'fr',
    },
  })

  // Administrateur
  await prisma.profile.upsert({
    where: { email: 'admin@loktore.bf' },
    update: { role: 'admin' },
    create: {
      email: 'admin@loktore.bf',
      passwordHash,
      fullName: 'Admin Loktoré',
      role: 'admin',
    },
  })

  // Structure + médecin
  const chu = await prisma.facility.upsert({
    where: { id: 'seed-chu-yalgado' },
    update: {},
    create: {
      id: 'seed-chu-yalgado',
      name: 'CHU Yalgado Ouédraogo',
      type: 'hospital',
      latitude: 12.3656,
      longitude: -1.5198,
      address: 'Ouagadougou',
      onDuty: true,
    },
  })

  const doctorProfile = await prisma.profile.upsert({
    where: { email: 'dr.ouedraogo@loktore.bf' },
    update: {},
    create: {
      email: 'dr.ouedraogo@loktore.bf',
      passwordHash,
      fullName: 'Dr Aminata Ouédraogo',
      role: 'doctor',
    },
  })

  await prisma.doctor.upsert({
    where: { id: doctorProfile.id },
    update: {},
    create: {
      id: doctorProfile.id,
      speciality: 'general',
      facilityId: chu.id,
      isOnline: true,
      consultationFee: 5000,
      bio: 'Médecin généraliste, 12 ans d’expérience.',
    },
  })

  await prisma.facility.upsert({
    where: { id: 'seed-pharma-wendpanga' },
    update: {},
    create: {
      id: 'seed-pharma-wendpanga',
      name: 'Pharmacie Wend-Panga',
      type: 'pharmacy',
      latitude: 12.3686,
      longitude: -1.5275,
      address: 'Avenue Kwame Nkrumah, Ouagadougou',
      onDuty: true,
    },
  })

  console.log('Seed terminé. Comptes test (mot de passe : password123) :')
  console.log('  patient@loktore.bf · dr.ouedraogo@loktore.bf · admin@loktore.bf')
  console.log('Patient id:', patient.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
