export function shouldRenderParkingPanels(plan) {
  return Boolean(plan?.parking_required);
}

export function buildPrimaryResultSections(plan) {
  const sections = ["hero", "reservation_risks", "execution_route"];

  if (shouldRenderParkingPanels(plan)) {
    sections.push("parking_guides", "hotel_areas");
  }

  return sections;
}
