import ky from "ky";

const date = new Date();

export function getCurrentYear() {
  return date.getFullYear();
}

export function getCurrentSeason() {
  const month = date.getMonth();
  if (month >= 0 && month <= 2) return "WINTER";
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  return "FALL";
}

export function getAiringPeriod() {
  const monthInSeconds = 2629743;
  let startTime = Math.floor(Date.now() / 1000);
  let endTime = startTime - monthInSeconds;

  return { startTime, endTime };
}

export function cleanText(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace("\n", " ");
}
