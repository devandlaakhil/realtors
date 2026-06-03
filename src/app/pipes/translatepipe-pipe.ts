import { inject, Pipe, PipeTransform } from "@angular/core";
import { LanguageServices } from "../shared-services/language-services";

@Pipe({
  name: 'T',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {

  langService = inject(LanguageServices);

  transform(key: string): string {
    return this.langService.translate(key);
  }
}