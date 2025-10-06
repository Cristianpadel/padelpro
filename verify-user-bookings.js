// Script para verificar el estado actual del usuario y las reservas
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAndBookings() {
  try {
    console.log('\n🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');
    console.log('='.repeat(60));

    // 1. Verificar usuario Alex García en DB
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (alex) {
      console.log('\n✅ Usuario Alex García en Base de Datos:');
      console.log('   ID:', alex.id);
      console.log('   Email:', alex.email);
      console.log('   Name:', alex.name);
      console.log('   Club ID:', alex.clubId);
      console.log('   Level:', alex.level);
      
      // 2. Verificar reservas en DB
      const bookings = await prisma.booking.findMany({
        where: { userId: alex.id },
        include: {
          timeSlot: {
            include: {
              instructor: {
                include: {
                  user: true
                }
              },
              court: true,
              club: true
            }
          }
        }
      });

      console.log('\n📋 Reservas en Base de Datos:');
      console.log(`   Total: ${bookings.length}`);
      bookings.forEach((booking, i) => {
        console.log(`\n   ${i + 1}. ${booking.status}`);
        console.log(`      ID: ${booking.id}`);
        console.log(`      TimeSlot: ${booking.timeSlotId}`);
        console.log(`      Date: ${booking.timeSlot.start.toLocaleString('es-ES')}`);
        console.log(`      Instructor: ${booking.timeSlot.instructor?.name || 'N/A'}`);
        console.log(`      Group Size: ${booking.groupSize}`);
      });

      // 3. Verificar time slots con reservas
      console.log('\n⏰ Clases con reservas activas:');
      const timeSlotsWithBookings = await prisma.timeSlot.findMany({
        where: {
          bookings: {
            some: {
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            }
          },
          start: {
            gte: new Date()
          }
        },
        include: {
          bookings: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED']
              }
            },
            include: {
              user: true
            }
          },
          instructor: {
            include: {
              user: true
            }
          },
          court: true
        },
        take: 10,
        orderBy: {
          start: 'asc'
        }
      });

      console.log(`   Total: ${timeSlotsWithBookings.length} clases con reservas`);
      timeSlotsWithBookings.forEach((slot, i) => {
        console.log(`\n   ${i + 1}. ${slot.start.toLocaleString('es-ES')}`);
        console.log(`      ID: ${slot.id}`);
        console.log(`      Instructor: ${slot.instructor?.name || 'N/A'}`);
        console.log(`      Court: ${slot.court?.number || 'N/A'}`);
        console.log(`      Reservas: ${slot.bookings.length}/${slot.maxPlayers}`);
        slot.bookings.forEach((booking, j) => {
          console.log(`         ${j + 1}. ${booking.user.name} (Grupo: ${booking.groupSize})`);
        });
      });

    } else {
      console.log('❌ Usuario Alex García NO encontrado en la base de datos');
    }

    // 4. Verificar otros usuarios con el ID viejo
    const oldIdBookings = await prisma.booking.findMany({
      where: {
        userId: {
          in: ['user-1', 'cmfwmut4v0001tgs0en3il18d']
        }
      }
    });

    if (oldIdBookings.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Encontradas reservas con IDs antiguos:');
      console.log(`   Total: ${oldIdBookings.length}`);
      oldIdBookings.forEach((b, i) => {
        console.log(`   ${i + 1}. User ID: ${b.userId}, TimeSlot: ${b.timeSlotId}`);
      });
      console.log('\n   💡 Solución: Actualizar estas reservas al nuevo ID o eliminarlas');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndBookings();
