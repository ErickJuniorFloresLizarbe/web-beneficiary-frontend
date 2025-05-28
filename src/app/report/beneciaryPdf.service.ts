import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BeneficiaryDTO } from '../interfaces/beneficiaryDTO';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  generateBeneficiarioPdf(beneficiario: BeneficiaryDTO): void {
    const doc = new jsPDF();

    // Título principal
    const title = 'Ficha del Beneficiario';
    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: 'center' });

    // Posición Y inicial después del título
    let currentY = 25;

    // Datos Personales
    this.generatePersonalDataTable(doc, beneficiario, (posY) => currentY = posY);

    // Educación
    this.generateEducationTable(doc, beneficiario.education, (posY) => currentY = posY);

    // Salud
    this.generateHealthTable(doc, beneficiario.health, (posY) => currentY = posY);

    // Guardar PDF
    try {
      doc.save(`beneficiario-${beneficiario.documentNumber}.pdf`);
    } catch (error) {
      console.error('Error al guardar el PDF:', error);
    }
  }

  // Datos Personales
  private generatePersonalDataTable(
    doc: jsPDF,
    beneficiario: BeneficiaryDTO,
    setY: (posY: number) => void
  ): void {
    autoTable(doc, {
      startY: 25,
      margin: { left: 15, right: 15 },
      head: [['Nombres', 'Apellido', 'Edad', 'Fecha de Nacimiento', 'Documento', 'Apadrinado']],
      body: [[
        beneficiario.name,
        beneficiario.surname,
        beneficiario.age.toString(),
        beneficiario.birthdate,
        beneficiario.documentNumber,
        beneficiario.sponsored.toString()
      ]],
      didDrawPage: (data) => {
        if (data.cursor) {
          setY(data.cursor.y + 10); // Espacio adicional para la siguiente tabla
        }
      }
    });
  }

  // Educación
  private generateEducationTable(
    doc: jsPDF,
    education: any[],
    setY: (posY: number) => void
  ): void {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 25,
      margin: { left: 15, right: 15 },
      head: [['Nivel de Estudio', 'Grado', 'Promedio', 'Cuaderno Completo', 'Asistencia', 'Tutorías']],
      body: education.map((item) => [
        item.degreeStudy,
        item.gradeBook,
        item.gradeAverage,
        item.fullNotebook,
        item.assistance,
        item.tutorials
      ]),
      didDrawPage: (data) => {
        if (data.cursor) {
          setY(data.cursor.y + 10);
        }
      }
    });
  }

  // Salud
  private generateHealthTable(
    doc: jsPDF,
    health: any[],
    setY: (posY: number) => void
  ): void {
    autoTable(doc, {
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 25,
      margin: { left: 15, right: 15 },
      head: [['Vacuna', 'VPH', 'Influenza', 'Desparasitación', 'Hemoglobina']],
      body: health.map((item) => [
        item.vaccine,
        item.vph,
        item.influenza,
        item.deworming,
        item.hemoglobin
      ]),
      didDrawPage: (data) => {
        if (data.cursor) {
          setY(data.cursor.y);
        }
      }
    });
  }
}
