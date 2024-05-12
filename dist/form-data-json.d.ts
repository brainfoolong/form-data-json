declare module 'form-data-json-convert' {
	interface OptionsToJson {
	  includeDisabled?: boolean;
	  includeButtonValues?: boolean;
	  uncheckedValue?: any;
	  inputFilter?: ((inputElement: HTMLInputElement) => boolean) | null;
	  processFieldValue?: ((inputElement: HTMLInputElement) => any) | null;
	  flatList?: boolean;
	  skipEmpty?: boolean;
	  filesCallback?: ((values: any) => void) | null;
	  fileReaderFunction?: string;
	  arrayify?: boolean;
	}

	interface OptionsFromJson {
	  flatList?: boolean;
	  clearOthers?: boolean;
	  resetOthers?: boolean;
	  triggerChangeEvent?: boolean;
	}

	function toJson(
	  form: HTMLFormElement | string | JQuery,
	  options?: OptionsToJson
	): any;

	function fromJson(
	  form: HTMLFormElement | string | JQuery,
	  values: any,
	  options?: OptionsFromJson
	): void;

	function reset(form: HTMLFormElement | string | JQuery): void;

	function clear(form: HTMLFormElement | string | JQuery): void;

	const defaultOptionsToJson: OptionsToJson;
	const defaultOptionsFromJson: OptionsFromJson;
  }